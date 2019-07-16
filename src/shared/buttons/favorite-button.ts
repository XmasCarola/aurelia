import { SharedState } from '../state/shared-state';
import { ArticleService } from '../services/article-service';
import { inject } from '@aurelia/kernel';
import { Router } from '@aurelia/router';
import { bindable } from '@aurelia/runtime';

@inject(Router, SharedState, ArticleService)
export class FavoriteButton {
  @bindable article;
  @bindable toggle;

  constructor(private readonly router: Router, private readonly sharedState, private readonly articleService) {
    this.router = router;
    this.sharedState = sharedState;
    this.articleService = articleService;
  }

  onToggleFavorited() {
    if (!this.sharedState.isAuthenticated) {
      this.router.goto('login');
      return;
    }
    this.article.favorited = !this.article.favorited;
    if (this.article.favorited)
      this.articleService.favorite(this.article.slug);
    else
      this.articleService.unfavorite(this.article.slug);

    this.toggle(this.article.favorited)
  }
}