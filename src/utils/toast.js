// Singleton toast dispatcher — lets any component fire a toast without prop drilling.
// The useToast hook (called once in App) registers the dispatch function here.

let _dispatch = null;

export function _setDispatch(fn) {
  _dispatch = fn;
}

export function toast(message, type = 'success') {
  _dispatch?.(message, type);
}
