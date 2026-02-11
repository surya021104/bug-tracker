import { createBugSignature } from "./analyzer/bugSignature.js";

const mockItem = {
    type: "TEST_BUG",
    title: "Test Bug Title",
    message: "Something went wrong"
};

try {
    console.log("Testing with valid URL...");
    const sig1 = createBugSignature(mockItem, "http://localhost:3000/test?query=1");
    console.log("Signature 1:", sig1);

    console.log("\nTesting with undefined URL...");
    const sig2 = createBugSignature(mockItem, undefined);
    console.log("Signature 2:", sig2);

    console.log("\nTesting with null URL...");
    const sig3 = createBugSignature(mockItem, null);
    console.log("Signature 3:", sig3);

    console.log("\nTesting with empty string URL...");
    const sig4 = createBugSignature(mockItem, "");
    console.log("Signature 4:", sig4);

    console.log("\n✅ All tests passed! No TypeErrors thrown.");
} catch (err) {
    console.error("\n❌ Test failed with error:", err);
    process.exit(1);
}
