"use client";

import ReceiptIframe from "@/components/atoms/ReceiptIframe";
import type { Receipt } from "@/types/goodbois";

type ReceiptStateProps = {
  receipt: Receipt;
  onBack: () => void;
};

export default function ReceiptState({ receipt, onBack }: ReceiptStateProps) {
  return <ReceiptIframe pdfUrl={receipt.pdfUrl} onBack={onBack} />;
}
