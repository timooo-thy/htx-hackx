import React from "react";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";

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
      Upload and Mask Images
    </Button>
  );
}
