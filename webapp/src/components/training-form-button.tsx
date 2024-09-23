import React from "react";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "./loading-spinner";

type TrainingFormButtonProps = {
  fileSelected: boolean;
};

export default function TrainingFormButton({
  fileSelected,
}: TrainingFormButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      disabled={pending || !fileSelected}
      type="submit"
      className="w-[200px]"
    >
      {pending ? (
        <LoadingSpinner className="h-h w-5" />
      ) : (
        "Upload and Mask Images"
      )}
    </Button>
  );
}
