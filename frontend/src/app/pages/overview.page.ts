import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, KeyValuePipe, RouterLink],
  templateUrl: './overview.page.html',
  styleUrl: './shared.css',
})
export class OverviewPage {
  private readonly api = inject(ApiService);
  readonly overview$ = this.api.getOverview();

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
