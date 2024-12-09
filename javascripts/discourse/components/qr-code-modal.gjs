import DModal from "discourse/components/d-modal";

const QRCodeModal = <template>
  <DModal
    @closeModal={{@closeModal}}
    @title={{@model.title}}
    class="qr-code-share-inline-modal"
  >
    <:body>
      <div class="qr-code-shareable-canvas"></div>
    </:body>
  </DModal>
</template>;

export default QRCodeModal;
