import {
  ArrowRight,
  Brain,
  LogIn,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BookCard, Book } from "./BookCard";

interface RecommendationProfile {
  favoriteCategories?: string[];
  recentSearches?: string[];
  signalCounts?: {
    purchased?: number;
    wishlist?: number;
    cart?: number;
    searches?: number;
  };
}

interface RecommendationAnchor {
  title?: string;
}

interface AIRecommendationsProps {
  isLoggedIn: boolean;
  loading?: boolean;
  sections: {
    forYou: Book[];
    mightLike: Book[];
    alsoBought: Book[];
  };
  profile?: RecommendationProfile | null;
  anchorBook?: RecommendationAnchor | null;
  wishlist?: Book[];
  onLoginClick: () => void;
  onAddToCart: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onToggleWishlist?: (book: Book) => void;
}

function RecommendationShelf({
  title,
  subtitle,
  books,
  icon: Icon,
  badge,
  wishlist,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
}: {
  title: string;
  subtitle: string;
  books: Book[];
  icon: LucideIcon;
  badge: string;
  wishlist?: Book[];
  onAddToCart: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onToggleWishlist?: (book: Book) => void;
}) {
  if (!books.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <Icon className="w-5 h-5 shrink-0" />
            <h3 className="text-2xl font-bold">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.slice(0, 4).map((book) => (
          <BookCard
            key={`${badge}-${book.id}`}
            book={book}
            badge={badge}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlist?.some(
              (item) => item.id.toString() === book.id.toString(),
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function AIRecommendations({
  isLoggedIn,
  loading,
  sections,
  profile,
  anchorBook,
  wishlist,
  onLoginClick,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
}: AIRecommendationsProps) {
  const favoriteCategories = profile?.favoriteCategories?.filter(Boolean) || [];
  const hasRecommendations =
    sections.forYou.length ||
    sections.mightLike.length ||
    sections.alsoBought.length;

  return (
    <section className="section-block px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-sm font-semibold mb-3">
              <Brain className="w-4 h-4" />
              AI Picks
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Gợi ý sách cá nhân hóa
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Dựa trên lịch sử mua, tìm kiếm, wishlist và thể loại bạn quan tâm.
            </p>
          </div>

          {favoriteCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favoriteCategories.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="section-panel p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h3 className="text-2xl font-bold mb-2">Sách dành cho bạn</h3>
              <p className="text-muted-foreground max-w-2xl">
                Đăng nhập để BookHaven ghi nhớ sách bạn mua, tìm kiếm và yêu
                thích, rồi tự động gợi ý các tựa phù hợp hơn.
              </p>
            </div>
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <LogIn className="w-5 h-5" />
              Đăng nhập
            </button>
          </div>
        ) : loading ? (
          <div className="text-muted-foreground py-6">
            Đang phân tích gu đọc của bạn...
          </div>
        ) : hasRecommendations ? (
          <div className="space-y-12">
            <RecommendationShelf
              title="Sách dành cho bạn"
              subtitle="Các tựa có điểm phù hợp cao nhất với hồ sơ đọc của bạn."
              books={sections.forYou}
              icon={Sparkles}
              badge="For You"
              wishlist={wishlist}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              onToggleWishlist={onToggleWishlist}
            />
            <RecommendationShelf
              title="Có thể bạn thích"
              subtitle="Mở rộng từ tác giả, thể loại và chủ đề bạn hay tương tác."
              books={sections.mightLike}
              icon={ArrowRight}
              badge="AI Match"
              wishlist={wishlist}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              onToggleWishlist={onToggleWishlist}
            />
            <RecommendationShelf
              title="Người mua sách này cũng mua"
              subtitle={
                anchorBook?.title
                  ? `Dựa trên độc giả cũng mua "${anchorBook.title}".`
                  : "Dựa trên các cặp sách thường được mua cùng nhau."
              }
              books={sections.alsoBought}
              icon={Users}
              badge="Also Bought"
              wishlist={wishlist}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              onToggleWishlist={onToggleWishlist}
            />
          </div>
        ) : (
          <div className="text-muted-foreground py-6">
            Chưa đủ dữ liệu để cá nhân hóa. Hãy tìm kiếm hoặc thêm sách vào
            wishlist để AI bắt đầu học gu đọc của bạn.
          </div>
        )}
      </div>
    </section>
  );
}
