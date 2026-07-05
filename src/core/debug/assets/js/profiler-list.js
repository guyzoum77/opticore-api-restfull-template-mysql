if (document.body.dataset.autoreload === "1") {
  setTimeout(() => location.reload(), 5000);
}
document.addEventListener("keydown", e => {
  if (e.key === "r" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") {
    location.reload();
  }
});
