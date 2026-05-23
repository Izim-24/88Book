import pool from "../config/database.js";

const MAX_RECOMMENDATIONS = 8;

const categoryRelations = {
  "Self-Help": ["Psychology", "Business", "Science", "Biography"],
  Psychology: ["Self-Help", "Science", "Biography"],
  Business: ["Self-Help", "Biography", "Science"],
  Manga: ["Comics", "Graphic Novel", "Fantasy", "Fiction"],
  Comics: ["Manga", "Graphic Novel", "Fantasy"],
  "Graphic Novel": ["Manga", "Comics", "Fantasy"],
  Fantasy: ["Fiction", "Manga", "Classic"],
  Fiction: ["Fantasy", "Romance", "Mystery", "Classic"],
  Mystery: ["Fiction", "Classic"],
  Romance: ["Fiction", "Drama"],
  Science: ["Self-Help", "Psychology", "Biography"],
  Biography: ["Self-Help", "Business", "Science"],
  Classic: ["Fiction", "Mystery"],
  Cooking: ["Health", "Lifestyle"],
};

const titleRelations = [
  {
    sources: ["atomic habits", "habit"],
    targets: ["deep work", "power of habit", "the power of habit", "focus"],
    reason: "Similar habit and focus themes",
  },
  {
    sources: ["deep work", "focus"],
    targets: ["atomic habits", "thinking fast", "thinking, fast and slow"],
    reason: "Related to productivity and thinking",
  },
  {
    sources: ["manga", "naruto", "one piece", "attack on titan"],
    targets: ["manga", "comic", "graphic novel", "fantasy"],
    reason: "Similar manga and illustrated story interests",
  },
];

const ensureSearchHistoryTable = async () => {
  await pool.query(`
    IF OBJECT_ID('book_search_history', 'U') IS NULL
    BEGIN
      CREATE TABLE book_search_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        query NVARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_book_search_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    END

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'IX_book_search_history_user_created'
        AND object_id = OBJECT_ID('book_search_history')
    )
    BEGIN
      CREATE INDEX IX_book_search_history_user_created
      ON book_search_history(user_id, created_at DESC);
    END
  `);
};

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const addWeight = (map, key, weight) => {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
};

const getTopKeys = (map, limit = 4) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);

const isSameCategory = (candidateCategory, sourceCategory) =>
  normalize(candidateCategory) === normalize(sourceCategory);

const isRelatedCategory = (candidateCategory, sourceCategory) => {
  const relationEntry = Object.entries(categoryRelations).find(([category]) =>
    isSameCategory(category, sourceCategory),
  );
  const related = relationEntry?.[1] || [];
  return related.some((category) => isSameCategory(candidateCategory, category));
};

const bookSearchText = (book) =>
  normalize(
    [
      book.title,
      book.author,
      book.category,
      book.description,
      book.isbn,
    ].join(" "),
  );

const getBookReason = (book, signals) => {
  for (const category of signals.favoriteCategories) {
    if (isSameCategory(book.category, category)) {
      return `Because you like ${category}`;
    }
    if (isRelatedCategory(book.category, category)) {
      return `Related to your ${category} interest`;
    }
  }

  const text = bookSearchText(book);
  const matchingSearch = signals.searchQueries.find((query) =>
    text.includes(normalize(query)),
  );
  if (matchingSearch) {
    return `Matches your search "${matchingSearch}"`;
  }

  return "Recommended by your reading profile";
};

const decorateBook = (book, recommendationReason, recommendationScore = 0) => ({
  ...book,
  recommendationReason,
  recommendationScore: Number(recommendationScore.toFixed(2)),
});

const buildSignals = ({ purchasedBooks, wishlistBooks, cartBooks, searches }) => {
  const categoryWeights = new Map();
  const authorWeights = new Map();
  const sourceTitles = [];
  const searchQueries = searches.map((item) => item.query).filter(Boolean);

  const collectBookSignals = (book, baseWeight) => {
    const quantityWeight = Number(book.signal_quantity) || 1;
    const weight = baseWeight + Math.min(quantityWeight, 4);

    addWeight(categoryWeights, book.category, weight);
    addWeight(authorWeights, book.author, weight * 0.75);
    if (book.title) {
      sourceTitles.push(book.title);
    }
  };

  purchasedBooks.forEach((book) => collectBookSignals(book, 5));
  wishlistBooks.forEach((book) => collectBookSignals(book, 4));
  cartBooks.forEach((book) => collectBookSignals(book, 3));

  searches.forEach((item, index) => {
    const query = item.query || "";
    const recencyBoost = Math.max(1, 4 - index * 0.4);
    const matchingCategory = Object.keys(categoryRelations).find((category) =>
      isSameCategory(category, query),
    );
    if (matchingCategory) {
      addWeight(categoryWeights, matchingCategory, recencyBoost);
    }
    sourceTitles.push(query);
  });

  const targetKeywords = new Map();
  const sourceText = normalize([...sourceTitles, ...searchQueries].join(" "));

  titleRelations.forEach((relation) => {
    if (relation.sources.some((source) => sourceText.includes(source))) {
      relation.targets.forEach((target) => addWeight(targetKeywords, target, 5));
    }
  });

  return {
    categoryWeights,
    authorWeights,
    targetKeywords,
    favoriteCategories: getTopKeys(categoryWeights, 5),
    favoriteAuthors: getTopKeys(authorWeights, 3),
    searchQueries,
  };
};

const scoreBook = (book, signals) => {
  let score = 0;
  const reasons = [];
  const text = bookSearchText(book);

  for (const [category, weight] of signals.categoryWeights.entries()) {
    if (isSameCategory(book.category, category)) {
      score += weight * 2;
      reasons.push(`category:${category}`);
    } else if (isRelatedCategory(book.category, category)) {
      score += weight * 1.1;
      reasons.push(`related:${category}`);
    }
  }

  for (const [author, weight] of signals.authorWeights.entries()) {
    if (normalize(book.author) === normalize(author)) {
      score += weight * 1.4;
      reasons.push(`author:${author}`);
    }
  }

  for (const [keyword, weight] of signals.targetKeywords.entries()) {
    if (text.includes(normalize(keyword))) {
      score += weight;
      reasons.push(`theme:${keyword}`);
    }
  }

  signals.searchQueries.forEach((query, index) => {
    const normalizedQuery = normalize(query);
    if (normalizedQuery && text.includes(normalizedQuery)) {
      score += Math.max(1, 4 - index * 0.3);
      reasons.push(`search:${query}`);
    }
  });

  score += (Number(book.rating) || 0) * 0.35;

  return { book, score, reasons };
};

const getAllCandidateBooks = async () => {
  const result = await pool.query(
    "SELECT TOP 200 * FROM books ORDER BY rating DESC, created_at DESC",
  );
  return result.rows;
};

const getFallbackBooks = (books, usedIds, limit = MAX_RECOMMENDATIONS) =>
  books
    .filter((book) => !usedIds.has(Number(book.id)))
    .sort((a, b) => {
      const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.id) - Number(a.id);
    })
    .slice(0, limit)
    .map((book) => decorateBook(book, "Popular with readers", 0));

const getAlsoBoughtRows = async (bookId, options = {}) => {
  const requestedLimit = Number.parseInt(String(options.limit || 6), 10);
  const safeLimit = Math.max(1, Math.min(requestedLimit || 6, 12));
  const params = [bookId];
  const excludeUserClause = options.excludeUserId
    ? `AND NOT EXISTS (
        SELECT 1
        FROM orders user_orders
        JOIN order_items user_items ON user_items.order_id = user_orders.id
        WHERE user_orders.user_id = $2
          AND user_items.book_id = b.id
      )`
    : "";

  if (options.excludeUserId) {
    params.push(options.excludeUserId);
  }

  const coPurchaseResult = await pool.query(
    `
    WITH related_books AS (
      SELECT oi2.book_id, COUNT(*) AS match_count
      FROM order_items oi1
      JOIN order_items oi2
        ON oi2.order_id = oi1.order_id
       AND oi2.book_id <> oi1.book_id
      WHERE oi1.book_id = $1
      GROUP BY oi2.book_id
    )
    SELECT TOP ${safeLimit} b.*, related_books.match_count
    FROM related_books
    JOIN books b ON b.id = related_books.book_id
    WHERE b.id <> $1
    ${excludeUserClause}
    ORDER BY related_books.match_count DESC, b.rating DESC, b.created_at DESC
    `,
    params,
  );

  if (coPurchaseResult.rows.length > 0) {
    return coPurchaseResult.rows.map((book) =>
      decorateBook(
        book,
        "Readers who bought this also bought it",
        Number(book.match_count) || 0,
      ),
    );
  }

  const anchorResult = await pool.query(
    "SELECT TOP 1 * FROM books WHERE id = $1",
    [bookId],
  );
  const anchorBook = anchorResult.rows[0];
  if (!anchorBook) {
    return [];
  }

  const fallbackParams = [bookId, anchorBook.category, anchorBook.author];
  const fallbackExcludeUserClause = options.excludeUserId
    ? `AND NOT EXISTS (
        SELECT 1
        FROM orders user_orders
        JOIN order_items user_items ON user_items.order_id = user_orders.id
        WHERE user_orders.user_id = $4
          AND user_items.book_id = books.id
      )`
    : "";

  if (options.excludeUserId) {
    fallbackParams.push(options.excludeUserId);
  }

  const fallbackResult = await pool.query(
    `
    SELECT TOP ${safeLimit} *
    FROM books
    WHERE books.id <> $1
      AND (
        books.category = $2
        OR books.author = $3
      )
    ${fallbackExcludeUserClause}
    ORDER BY rating DESC, created_at DESC
    `,
    fallbackParams,
  );

  return fallbackResult.rows.map((book) =>
    decorateBook(book, `Similar to ${anchorBook.title}`, Number(book.rating) || 0),
  );
};

export const getPersonalizedRecommendations = async (req, res) => {
  try {
    await ensureSearchHistoryTable();

    const userId = req.user.userId;
    const [
      purchasedResult,
      wishlistResult,
      cartResult,
      searchesResult,
      allBooks,
    ] = await Promise.all([
      pool.query(
        `
        SELECT b.*, oi.quantity AS signal_quantity, o.created_at AS signal_created_at
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN books b ON b.id = oi.book_id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
        `,
        [userId],
      ),
      pool.query(
        `
        SELECT b.*, w.created_at AS signal_created_at
        FROM wishlists w
        JOIN books b ON b.id = w.book_id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
        `,
        [userId],
      ),
      pool.query(
        `
        SELECT b.*, ci.quantity AS signal_quantity, ci.created_at AS signal_created_at
        FROM cart_items ci
        JOIN books b ON b.id = ci.book_id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at DESC
        `,
        [userId],
      ),
      pool.query(
        `
        SELECT TOP 12 query, created_at
        FROM book_search_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId],
      ),
      getAllCandidateBooks(),
    ]);

    const purchasedBooks = purchasedResult.rows;
    const wishlistBooks = wishlistResult.rows;
    const cartBooks = cartResult.rows;
    const signals = buildSignals({
      purchasedBooks,
      wishlistBooks,
      cartBooks,
      searches: searchesResult.rows,
    });

    const excludeIds = new Set(
      [...purchasedBooks, ...wishlistBooks, ...cartBooks].map((book) =>
        Number(book.id),
      ),
    );

    const scoredBooks = allBooks
      .filter((book) => !excludeIds.has(Number(book.id)))
      .map((book) => scoreBook(book, signals))
      .sort((a, b) => b.score - a.score);

    const forYou =
      scoredBooks.filter((item) => item.score > 1.8).slice(0, MAX_RECOMMENDATIONS);
    const usedIds = new Set([
      ...excludeIds,
      ...forYou.map((item) => Number(item.book.id)),
    ]);

    const forYouBooks =
      forYou.length > 0
        ? forYou.map((item) =>
            decorateBook(item.book, getBookReason(item.book, signals), item.score),
          )
        : getFallbackBooks(allBooks, usedIds);

    forYouBooks.forEach((book) => usedIds.add(Number(book.id)));

    const mightLikeCandidates = scoredBooks
      .filter((item) => !usedIds.has(Number(item.book.id)))
      .filter((item) => item.score > 0.5)
      .slice(0, MAX_RECOMMENDATIONS)
      .map((item) =>
        decorateBook(item.book, getBookReason(item.book, signals), item.score),
      );

    const mightLikeBooks =
      mightLikeCandidates.length > 0
        ? mightLikeCandidates
        : getFallbackBooks(allBooks, usedIds);

    mightLikeBooks.forEach((book) => usedIds.add(Number(book.id)));

    const anchorBook =
      purchasedBooks[0] || wishlistBooks[0] || cartBooks[0] || null;
    const alsoBoughtBooks = anchorBook
      ? await getAlsoBoughtRows(anchorBook.id, {
          excludeUserId: userId,
          limit: 6,
        })
      : [];

    res.json({
      success: true,
      strategy: "hybrid-behavior-scoring",
      profile: {
        favoriteCategories: signals.favoriteCategories,
        favoriteAuthors: signals.favoriteAuthors,
        recentSearches: signals.searchQueries.slice(0, 5),
        signalCounts: {
          purchased: purchasedBooks.length,
          wishlist: wishlistBooks.length,
          cart: cartBooks.length,
          searches: searchesResult.rows.length,
        },
      },
      anchorBook: anchorBook
        ? {
            id: anchorBook.id,
            title: anchorBook.title,
            author: anchorBook.author,
            category: anchorBook.category,
          }
        : null,
      sections: {
        forYou: forYouBooks,
        mightLike: mightLikeBooks,
        alsoBought: alsoBoughtBooks,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      success: false,
      message: "Error generating personalized recommendations",
    });
  }
};

export const recordSearch = async (req, res) => {
  try {
    await ensureSearchHistoryTable();

    const userId = req.user.userId;
    const query = String(req.body.query || "").trim().slice(0, 255);

    if (query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must contain at least 2 characters",
      });
    }

    await pool.query(
      "INSERT INTO book_search_history (user_id, query) VALUES ($1, $2)",
      [userId, query],
    );

    await pool.query(
      `
      DELETE FROM book_search_history
      WHERE user_id = $1
        AND id NOT IN (
          SELECT id
          FROM (
            SELECT TOP 40 id
            FROM book_search_history
            WHERE user_id = $1
            ORDER BY created_at DESC
          ) recent_searches
        )
      `,
      [userId],
    );

    res.status(201).json({
      success: true,
      message: "Search saved",
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      success: false,
      message: "Error recording search",
    });
  }
};

export const getAlsoBoughtForBook = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!Number.isInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book id",
      });
    }

    const books = await getAlsoBoughtRows(bookId, { limit: 6 });

    res.json({
      success: true,
      books,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      success: false,
      message: "Error fetching related books",
    });
  }
};
