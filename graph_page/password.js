var passwordModal = null;
var password = null;
var passwordOkBtn = null;
var callback = null;

function initPassword() {
  passwordModal = new M.Modal(document.getElementById("password-modal"), {});
  password = document.getElementById("password");
  passwordOkBtn = document.getElementById("password-ok-btn");
  passwordOkBtn.addEventListener("click", function() {
    var pwd = password.value;
    callback(pwd);
    password.value = "";
  });
}

function passwordPrompt(cb) {
  passwordModal.open();
  callback = cb;
}
