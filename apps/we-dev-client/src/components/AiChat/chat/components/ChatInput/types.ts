import type { FilePreview } from "@/stores/chatSlice";
import type { ErrorMessage } from "../../../../WeIde/stores/fileStore";
import { IModelOption } from "../..";

export interface ChatInputProps {
  input: string;
  isLoading: boolean;
  stopRuning: () => void;
  isUploading: boolean;
  uploadedImages: FilePreview[];
  baseModal: IModelOption;
  setBaseModal: (value: IModelOption) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeySubmit: (e: React.KeyboardEvent) => void;
  handleSubmitWithFiles: (e, text?: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (id: string) => void;
  addImages: (images: FilePreview[]) => void;
  setInput: (text: string) => void
  setIsUploading: (value: boolean) => void;
  handleSketchUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ErrorDisplayProps {
  errors: ErrorMessage[];
  onAttemptFix: (error: ErrorMessage, index: number) => void;
  onRemoveError: (index: number) => void;
}

export interface ImagePreviewGridProps {
  uploadedImages: FilePreview[];
  onRemoveImage: (id: string) => void;
}

export interface UploadButtonsProps {
  isLoading: boolean;
  isUploading: boolean;
  baseModal: IModelOption;
  setBaseModal: (value: IModelOption) => void;
  onImageClick: () => void;
  onSketchClick: () => void;
}

export interface SendButtonProps {
  isLoading: boolean;
  isUploading: boolean;
  hasInput: boolean;
  stop: () => void;
  hasUploadingImages: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
} 