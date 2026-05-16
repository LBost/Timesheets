import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ClientsFeedbackStateComponent } from '../../clients/ui/components/clients-feedback-state.component';
import { ActivityLogCategory } from '../models/activity-log.model';
import { ActivityLogsStore } from '../state/activity-logs.store';

type CategoryOption = {
  value: ActivityLogCategory;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: ActivityLogCategory.ALL, label: 'All' },
  { value: ActivityLogCategory.TIME_ENTRIES, label: 'Time entries' },
  { value: ActivityLogCategory.INVOICES, label: 'Invoices' },
  { value: ActivityLogCategory.EMAIL, label: 'Email' },
];

@Component({
  selector: 'app-activity-logs-page',
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmSpinnerImports,
    HlmTableImports,
    ClientsFeedbackStateComponent,
  ],
  template: `
    <section class="flex flex-col gap-6">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">Activity log</h2>
        <p class="text-sm text-muted-foreground">
          Read-only history of time entry, invoice, and email actions.
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium">Category</span>
          <div class="inline-flex flex-wrap items-center rounded-md border border-border p-1">
            @for (option of categoryOptions; track option.value) {
              <button
                hlmBtn
                type="button"
                size="sm"
                variant="ghost"
                [class.bg-accent]="category() === option.value"
                (click)="setCategory(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </label>

        <label class="grid gap-1.5 text-sm">
          <span class="font-medium">From</span>
          <input
            hlmInput
            type="date"
            [ngModel]="fromDate()"
            (ngModelChange)="fromDate.set($event)"
          />
        </label>

        <label class="grid gap-1.5 text-sm">
          <span class="font-medium">To</span>
          <input hlmInput type="date" [ngModel]="toDate()" (ngModelChange)="toDate.set($event)" />
        </label>

        <button hlmBtn type="button" (click)="applyFilters()">Apply filters</button>
      </div>

      <app-clients-feedback-state [storeError]="store.error()" [isLoading]="store.isLoading()" />

      @if (!store.isLoading() && store.logs().length === 0 && !store.error()) {
        <p class="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          No activity found for the selected filters.
        </p>
      }

      @if (store.logs().length > 0) {
        <div class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div hlmTableContainer>
            <table hlmTable class="w-full">
              <thead hlmTHead>
                <tr hlmTr>
                  <th hlmTh class="w-44">When</th>
                  <th hlmTh>Summary</th>
                  <th hlmTh class="w-48">Action</th>
                </tr>
              </thead>
              <tbody hlmTBody>
                @for (log of store.logs(); track log.id) {
                  <tr hlmTr>
                    <td hlmTd class="text-sm text-muted-foreground">
                      {{ formatTimestamp(log.createdAt) }}
                    </td>
                    <td hlmTd class="text-sm">{{ log.summary }}</td>
                    <td hlmTd>
                      <span
                        class="inline-flex rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-xs font-medium"
                      >
                        {{ log.actionLabel }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (store.nextCursor()) {
          <div class="flex justify-center">
            <button
              hlmBtn
              type="button"
              variant="outline"
              [disabled]="store.isLoadingMore()"
              (click)="loadMore()"
            >
              @if (store.isLoadingMore()) {
                <hlm-spinner size="sm" class="mr-2" />
              }
              Load more
            </button>
          </div>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogsPage implements OnInit {
  protected readonly store = inject(ActivityLogsStore);
  protected readonly categoryOptions = CATEGORY_OPTIONS;

  protected readonly category = signal<ActivityLogCategory>(ActivityLogCategory.ALL);
  protected readonly fromDate = signal(this.store.fromDate());
  protected readonly toDate = signal(this.store.toDate());

  ngOnInit(): void {
    void this.store.loadLogs();
  }

  protected setCategory(category: ActivityLogCategory): void {
    this.category.set(category);
  }

  protected applyFilters(): void {
    this.store.setCategory(this.category());
    this.store.setDateRange(this.fromDate(), this.toDate());
    void this.store.loadLogs();
  }

  protected loadMore(): void {
    void this.store.loadMoreLogs();
  }

  protected formatTimestamp(value: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }
}
