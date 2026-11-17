import { useEffect, useRef } from "react";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

export function EvaluationNotice({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="evaluation-dialog"
      aria-labelledby="evaluation-title"
      aria-describedby="evaluation-description"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <button
        className="evaluation-close"
        aria-label="데모 안내 닫기"
        onClick={onDismiss}
      >
        <IconX size={21} />
      </button>
      <span className="evaluation-info" aria-hidden="true">
        <IconInfoCircle size={27} />
      </span>
      <h2 id="evaluation-title">밥길 체험용 데모</h2>
      <p id="evaluation-description">
        혼잡도·버스는 예시입니다.
        <br />
        실제 이동 판단에 사용하지 마세요.
      </p>
      <p className="evaluation-storage">
        입력 내용은 이 브라우저에만 저장됩니다.
      </p>
      <button
        autoFocus
        className="primary evaluation-confirm"
        onClick={onDismiss}
      >
        확인하고 시작하기
      </button>
    </dialog>
  );
}
