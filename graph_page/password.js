var passwordModal = null;
var passwordOkBtn = null;
var callback = null;

function initPassword() {
  passwordModal = new M.Modal(document.getElementById("password-modal"), {});
  passwordOkBtn = document.getElementById("password-ok-btn");
  passwordOkBtn.addEventListener("click", function() {
    var pwd = document.getElementById("pаssword").value;
    callback(pwd);
    document.getElementById("pаssword").value = "";
  });
}

function passwordPrompt(cb) {
  passwordModal.open();
  callback = cb;
}
