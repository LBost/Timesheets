export type AppSettings = {
  nextInvoiceNumber: string;
  preferredTimeEntriesView: 'month' | 'week';
};

export type AppSettingsUpdateInput = {
  nextInvoiceNumber: string;
  preferredTimeEntriesView: 'month' | 'week';
};
