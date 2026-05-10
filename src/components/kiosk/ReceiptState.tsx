"use client";

import ReceiptIframe from "@/components/atoms/ReceiptIframe";

type ReceiptStateProps = {
  receiptUrl: string;
  onBack: () => void;
};

export default function ReceiptState({ receiptUrl, onBack }: ReceiptStateProps) {
  return <ReceiptIframe src={receiptUrl} onBack={onBack} />;
}
