abstract class BaseOperator {
  protected constructor() {}
  abstract onBlur(event: FocusEvent): void;
  abstract onClick(event: MouseEvent): void;
  abstract onKeyDown(event: KeyboardEvent): void;
  abstract onInput(event: InputEvent): void;
  abstract onBeforeInput(event: InputEvent): void;
  abstract onPaste(event: ClipboardEvent): void;
  abstract onCompositionStart(event: CompositionEvent): void;
  abstract onCompositionEnd(event: CompositionEvent): void;
}

export default BaseOperator;
