const ACCOUNT_KEY = "deimiantask_registered";

export function hasAccount() {
  return window.localStorage.getItem(ACCOUNT_KEY) === "1";
}

export function markAccount() {
  window.localStorage.setItem(ACCOUNT_KEY, "1");
}
