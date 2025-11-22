"use client";

import { Modal } from "antd";
import { memo } from "react";
import HLSPlayer from "./HLSPlayer";

interface VideoPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string;
  poster?: string;
}

const VideoPreviewModal = memo(
  ({ open, onClose, title, src, poster }: VideoPreviewModalProps) => {
    return (
      <Modal
        title={`Xem video: ${title}`}
        open={open}
        onCancel={onClose}
        footer={null}
        width={800}
        destroyOnHidden
        centered
        afterClose={() => {
          // Cleanup when modal closes
          console.log("Video modal closed");
        }}
      >
        {open && src && (
          <div className="mt-4">
            <HLSPlayer
              key={src} // Force re-mount when src changes
              src={src}
              poster={poster}
              className="w-full rounded-lg"
              width="100%"
              height="auto"
              onError={(error) => {
                console.error("HLS Player error:", error);
              }}
              onReady={() => {
                console.log("HLS Player ready");
              }}
            />
          </div>
        )}
      </Modal>
    );
  },
);

VideoPreviewModal.displayName = "VideoPreviewModal";

export default VideoPreviewModal;
