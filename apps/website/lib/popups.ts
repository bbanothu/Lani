export type PopupAlertOpts = {
  title?: string;
  message: string;
  okLabel?: string;
};

export type PopupConfirmOpts = {
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export type PopupPromptOpts = {
  title?: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  okLabel?: string;
  cancelLabel?: string;
};

export type PopupListPickerOpts = {
  title?: string;
  productId: string;
};

export type PopupDeleteChoiceOpts = {
  title?: string;
  message: string;
};

export type DeleteChoice = 'delete' | 'flag' | null;

export type PopupShareOpts = {
  listId: string;
  listTitle: string;
};

type PopupRequest =
  | { kind: 'alert'; opts: PopupAlertOpts; resolve: () => void }
  | { kind: 'confirm'; opts: PopupConfirmOpts; resolve: (value: boolean) => void }
  | { kind: 'prompt'; opts: PopupPromptOpts; resolve: (value: string | null) => void }
  | { kind: 'listPicker'; opts: PopupListPickerOpts; resolve: () => void }
  | { kind: 'deleteChoice'; opts: PopupDeleteChoiceOpts; resolve: (value: DeleteChoice) => void }
  | { kind: 'share'; opts: PopupShareOpts; resolve: () => void };

type PopupHandler = (request: PopupRequest) => void;

let handler: PopupHandler | null = null;
const queue: PopupRequest[] = [];

export function registerPopupHandler(next: PopupHandler | null): () => void {
  handler = next;
  if (next) {
    while (queue.length) next(queue.shift()!);
  }
  return () => {
    if (handler === next) handler = null;
  };
}

function enqueue(request: PopupRequest) {
  if (handler) handler(request);
  else queue.push(request);
}

export const popups = {
  alert(messageOrOpts: string | PopupAlertOpts): Promise<void> {
    const opts = typeof messageOrOpts === 'string' ? { message: messageOrOpts } : messageOrOpts;
    return new Promise((resolve) => enqueue({ kind: 'alert', opts, resolve }));
  },

  confirm(messageOrOpts: string | PopupConfirmOpts): Promise<boolean> {
    const opts = typeof messageOrOpts === 'string' ? { message: messageOrOpts } : messageOrOpts;
    return new Promise((resolve) => enqueue({ kind: 'confirm', opts, resolve }));
  },

  prompt(messageOrOpts: string | PopupPromptOpts): Promise<string | null> {
    const opts = typeof messageOrOpts === 'string' ? { message: messageOrOpts } : messageOrOpts;
    return new Promise((resolve) => enqueue({ kind: 'prompt', opts, resolve }));
  },

  listPicker(opts: PopupListPickerOpts): Promise<void> {
    return new Promise((resolve) => enqueue({ kind: 'listPicker', opts, resolve }));
  },

  deleteChoice(opts: PopupDeleteChoiceOpts): Promise<DeleteChoice> {
    return new Promise((resolve) => enqueue({ kind: 'deleteChoice', opts, resolve }));
  },

  share(opts: PopupShareOpts): Promise<void> {
    return new Promise((resolve) => enqueue({ kind: 'share', opts, resolve }));
  },
};
