export async function beforeRunHook(details) {
  console.log("after:run", details);
}

export async function afterRunHook(results) {
  console.log("after:run", results);
}
