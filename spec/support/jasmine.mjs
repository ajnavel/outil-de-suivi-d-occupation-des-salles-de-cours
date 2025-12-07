export default {
  spec_dir: "spec",
  spec_files: [
    "**/*.spec.js"    // on cherche des .spec.js maintenant
  ],
  helpers: [
    // pas de ts-node, plus simple
  ],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true
  }
}
