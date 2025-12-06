export default {
  spec_dir: "spec",
  spec_files: [
    "**/*.spec.ts"    
  ],
  helpers: [
    "../node_modules/ts-node/register",  
  ],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true
  }
}
