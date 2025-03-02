import { create } from "zustand";
import { IModelOption } from "@/components/AiChat/chat";

export interface FilePreview {
  id: string;
  file: File;
  url: string;
  localUrl: string;
  status?: "uploading" | "done" | "error";
}


interface ChatState {
  isDeepThinking: boolean;
  setIsDeepThinking: (isDeepThinking: boolean) => void;
  modelOptions: IModelOption[]; 
  setModelOptions: (v: IModelOption[]) => void;
  uploadedImages: FilePreview[];
  setUploadedImages: (images: FilePreview[]) => void;
  addImages: (images: FilePreview[]) => void;
  updateImageStatus: (id: string, status: FilePreview["status"]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
}
const useChatStore = create<ChatState>((set) => ({
  isDeepThinking: false,
  setIsDeepThinking: (isDeepThinking: boolean) => set({ isDeepThinking }),
  uploadedImages: [],
  setModelOptions: (options) => set({ modelOptions: options }),
  setUploadedImages: (images) => set({ uploadedImages: images }),
  addImages: (images) =>
    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...images],
    })),
  updateImageStatus: (id, status) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.map((img) =>
        img.id === id ? { ...img, status } : img
      ),
    })),
  removeImage: (id) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
    })),
  clearImages: () => set({ uploadedImages: [] }),
  modelOptions: [],

}));

export default useChatStore;
