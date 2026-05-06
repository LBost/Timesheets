import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  HlmSidebar,
  HlmSidebarContent,
  HlmSidebarFooter,
  HlmSidebarGroup,
  HlmSidebarGroupContent,
  HlmSidebarGroupLabel,
  HlmSidebarHeader,
  HlmSidebarMenu,
  HlmSidebarMenuButton,
  HlmSidebarMenuItem,
} from '@spartan-ng/helm/sidebar';
import { NavigationItem, NavigationSection } from '../navigation.config';

@Component({
  selector: 'app-shell-sidebar-nav',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmSidebar,
    HlmSidebarContent,
    HlmSidebarFooter,
    HlmSidebarGroup,
    HlmSidebarGroupContent,
    HlmSidebarGroupLabel,
    HlmSidebarHeader,
    HlmSidebarMenu,
    HlmSidebarMenuButton,
    HlmSidebarMenuItem,
  ],
  template: `
    <hlm-sidebar
      collapsible="icon"
      aria-label="Primary navigation"
      sidebarContainerClass="border-sidebar-border/40"
    >
      <div hlmSidebarHeader>
        <div class="px-2 text-sm font-bold tracking-wide text-sidebar-primary group-data-[collapsible=icon]:hidden">
          Timesheets
        </div>
      </div>

      <div hlmSidebarContent>
        @for (section of sections(); track section.label) {
          <div hlmSidebarGroup [attr.aria-label]="section.label">
            <div hlmSidebarGroupLabel>{{ section.label }}</div>
            <div hlmSidebarGroupContent>
              <ul hlmSidebarMenu>
                @for (item of section.items; track item.route) {
                  @if (item.enabled) {
                    <li hlmSidebarMenuItem>
                      <a
                        hlmSidebarMenuButton
                        [routerLink]="item.route"
                        [tooltip]="item.label"
                        routerLinkActive
                        #activeRla="routerLinkActive"
                        [isActive]="activeRla.isActive"
                        [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                      >
                        <ng-icon class="shrink-0 text-current" [name]="item.icon" aria-hidden="true" />
                        <span>{{ item.label }}</span>
                      </a>
                    </li>
                  } @else {
                    <li hlmSidebarMenuItem>
                      <button
                        hlmSidebarMenuButton
                        disabled
                        [tooltip]="item.comingSoon ? item.label + ' (coming soon)' : item.label"
                      >
                        <ng-icon class="shrink-0 text-current" [name]="item.icon" aria-hidden="true" />
                        <span>{{ item.label }}</span>
                        @if (item.comingSoon) {
                          <span class="ms-auto text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                            Soon
                          </span>
                        }
                      </button>
                    </li>
                  }
                }
              </ul>
            </div>
          </div>
        }
      </div>

      <hlm-sidebar-footer>
        <ul hlmSidebarMenu>
          @for (item of footerItems(); track item.route) {
            @if (item.enabled) {
              <li hlmSidebarMenuItem>
                <a
                  hlmSidebarMenuButton
                  [routerLink]="item.route"
                  [tooltip]="item.label"
                  routerLinkActive
                  #activeRla="routerLinkActive"
                  [isActive]="activeRla.isActive"
                >
                  <ng-icon class="shrink-0 text-current" [name]="item.icon" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                </a>
              </li>
            } @else {
              <li hlmSidebarMenuItem>
                <button
                  hlmSidebarMenuButton
                  disabled
                  [tooltip]="item.comingSoon ? item.label + ' (coming soon)' : item.label"
                >
                  <ng-icon class="shrink-0 text-current" [name]="item.icon" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                  @if (item.comingSoon) {
                    <span class="ms-auto text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                      Soon
                    </span>
                  }
                </button>
              </li>
            }
          }
        </ul>
      </hlm-sidebar-footer>
    </hlm-sidebar>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellSidebarNavComponent {
  readonly sections = input.required<NavigationSection[]>();
  readonly footerItems = input.required<NavigationItem[]>();
}
