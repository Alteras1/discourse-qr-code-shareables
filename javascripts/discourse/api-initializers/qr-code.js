import { apiInitializer } from "discourse/lib/api";
import loadScript from "discourse/lib/load-script";
import discourseLater from "discourse-common/lib/later";
import I18n from "I18n";
import QRCodeModal from "../components/qr-code-modal";

/**
 * @typedef {import("../../../node_modules/qr-code-styling").default} QRCodeStyling
 */

/**
 * creates a canvas element to append the QR code to
 * @returns {Node}
 */
const createCanvas = () => {
  const template = document.createElement("template");
  template.innerHTML = `<div class="qr-code-shareable-canvas"></div>`;
  return template.content.firstChild;
};

/**
 * Generates a QR code for the given link and appends it to the DOM.
 * @param {string} link the url to be converted to a QR code
 * @param {HTMLElement} element the element to append the QR code to
 */
async function generateQRCode(link, element) {
  await loadScript(settings.theme_uploads_local.qr_code_styling);
  const QRCodeStyling = window.QRCodeStyling;
  /** @type {QRCodeStyling} */
  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    data: link,
    image: settings.image,
    dotsOptions: {
      color: settings.dots_color,
      type: settings.dots_type,
    },
    cornersSquareOptions: {
      color: settings.corners_square_color,
      type: settings.corners_square_type,
    },
    cornersDotOptions: {
      // color doesn't seem to work
      // color: settings.corners_dot_color,
      type: settings.corners_dot_type,
    },
    backgroundOptions: {
      color: settings.background_color,
    },
    imageOptions: {
      hideBackgroundDots: settings.image_hide_background_dots,
      margin: settings.image_margin,
      imageSize: settings.image_size,
    },
    margin: 3,
  });
  // a bit of a hack, but force a rerender to make sure the image is loaded on mobile
  await qrCode.getRawData("png");
  const blob = await qrCode.getRawData("png");
  const image = document.createElement("img");
  image.src = URL.createObjectURL(blob);
  image.alt = "QR Code";
  image.width = 300;
  image.height = 300;
  element.appendChild(image);
}

/**
 * Add QR code in the context of the share button (in a modal) that was clicked.
 *
 * This is really jank, mostly due to the clickHandler of the Sharing API
 * not passing any information (and regexing a URL is a bad idea).
 * Similarly, there isn't a plugin context in the invite modals, post share
 * modals, etc. so we have to do some guesswork with the DOM.
 *
 * @param {string} link The link to generate a QR code for.
 * @param {string} title The title of the topic.
 */
async function generateShareButtonQR(link, title, api) {
  // assumes only one modal is open at a time
  const shareModal = document.querySelector(".share-topic-modal");
  if (shareModal) {
    const canvas = createCanvas();
    if (shareModal.querySelector(".qr-code-shareable-canvas")) {
      shareModal.querySelector(".qr-code-shareable-canvas").remove();
    }
    shareModal.querySelector(".d-modal__body").appendChild(canvas);
    generateQRCode(link, canvas);
  } else {
    // add a new modal just for the weird scenario where user uses the highlighted share button
    api.container.lookup("service:modal").show(QRCodeModal, {
      model: {
        title,
      },
    });
    discourseLater(() => {
      const canvas = document.querySelector(
        ".qr-code-share-inline-modal .qr-code-shareable-canvas"
      );
      generateQRCode(link, canvas);
    });
  }
}

export default apiInitializer("1.13.0", (api) => {
  api.addSharingSource({
    id: "qr-code-shareables",
    title: I18n.t(themePrefix("qr_code_share_title")),
    icon: "qr-code-share",
    // If provided, handle by custom javascript rather than default url open
    clickHandler(link, title) {
      generateShareButtonQR(link, title, api);
    },
    // If true, will show the sharing service in PMs and login_required sites
    showInPrivateContext: settings.share_in_private,
  });
});
