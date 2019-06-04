var PasswordModal = {
  modal: null,
  button: null,
  callback: null,

  load: function() {
    PasswordModal.modal = new M.Modal(document.getElementById("password-modal"), {});
    PasswordModal.button = document.getElementById("password-ok-btn");
    PasswordModal.button.addEventListener("click", function() {
      var pwd = document.getElementById("password").value;
      PasswordModal.callback(pwd);
      document.getElementById("password").value = "";
    });
  },

  showPrompt: function(cb) {
    PasswordModal.modal.open();
    PasswordModal.callback = cb;
  }
}