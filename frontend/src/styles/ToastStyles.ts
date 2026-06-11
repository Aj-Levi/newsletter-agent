interface ToastInterface{
    autoClose: number;
    className: string;
}

const ToastStyles: ToastInterface = {
  autoClose: 2500,
  className: "!bg-neutral !text-neutral-content",
};

export default ToastStyles;
