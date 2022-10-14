function checkPassword(password, email, firstName, lastName) {
  return !(
    password.length < 8 ||
    password.includes(email) ||
    password.includes(firstName) ||
    password.includes(lastName) ||
    !/\d/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password) ||
    !/[a-zA-Z]/.test(password)
  );
}

module.exports = { checkPassword };
