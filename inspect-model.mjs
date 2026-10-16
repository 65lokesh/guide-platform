import { NodeIO } from "@gltf-transform/core";

const io = new NodeIO();
const document = await io.read("public/models/robot.glb");
const root = document.getRoot();

function printNode(node, depth = 0) {
  console.log("  ".repeat(depth) + "- " + (node.getName() || "(unnamed)"));
  node.listChildren().forEach((child) => printNode(child, depth + 1));
}

console.log("=== Node hierarchy ===");
root.listScenes().forEach((scene) => {
  scene.listChildren().forEach((node) => printNode(node, 0));
});

console.log("\n=== All node names (flat list) ===");
root.listNodes().forEach((node) => console.log("-", node.getName() || "(unnamed)"));
