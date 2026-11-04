package vn.ptit.search.presentation;
import java.util.List;
import vn.ptit.search.application.SearchService;
import vn.ptit.search.domain.SearchQuery;
import vn.ptit.search.domain.SearchResult;
public final class SearchController {
  private final SearchService service;
  public SearchController(SearchService service) { this.service = service; }
  public List<SearchResult> search(SearchQuery request) { return service.search(request); }
}
