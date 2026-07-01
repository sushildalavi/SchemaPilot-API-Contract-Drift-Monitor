import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ApiService } from '../api.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './documents.page.html',
  styleUrl: './shared.css',
})
export class DocumentsPage {
  private readonly api = inject(ApiService);
  readonly payloads$ = this.api.getPayloadSnapshots();
  readonly diffs$ = this.api.getSchemaDiffDocuments();
  readonly validations$ = this.api.getValidationErrors();
  readonly replayArtifacts$ = this.api.getReplayArtifacts();
}
