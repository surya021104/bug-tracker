import { useState } from "react";

/**
 * Demo page showing button monitor detecting broken buttons
 */
export default function ButtonTestDemo() {
    const [clickCount, setClickCount] = useState(0);

    const workingButton = () => {
        setClickCount(prev => prev + 1);
        alert("This button works! ");
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h1> Button Monitor Test Demo</h1>
            <p>Click the buttons below to test the automatic bug detection system:</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2rem" }}>

                {/* Working Button */}
                <div style={{ padding: "1.5rem", border: "2px solid #4CAF50", borderRadius: "8px" }}>
                    <h3> Working Button</h3>
                    <p>This button has a proper click handler and will work normally.</p>
                    <button
                        onClick={workingButton}
                        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer" }}
                    >
                        Click Me - I Work! (Clicked: {clickCount} times)
                    </button>
                </div>

                {/* Broken Button - No Handler */}
                <div style={{ padding: "1.5rem", border: "2px solid #f44336", borderRadius: "8px" }}>
                    <h3> Broken Button - No Handler</h3>
                    <p>This button has NO click handler. The monitor will detect it after 3 seconds.</p>
                    <button
                        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer" }}
                    >
                        Click Me - I'm Broken! 
                    </button>
                </div>

                {/* Broken Button - Empty Handler */}
                <div style={{ padding: "1.5rem", border: "2px solid #FF9800", borderRadius: "8px" }}>
                    <h3> Broken Button - Does Nothing</h3>
                    <p>This button has a handler but does nothing. Click it 3 times rapidly to trigger detection.</p>
                    <button
                        onClick={() => {
                            // This does nothing - intentionally broken
                            console.log("Button clicked but nothing happens");
                        }}
                        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer" }}
                    >
                        Click Me 3 Times Fast!
                    </button>
                </div>

                {/* Instructions */}
                <div style={{ padding: "1.5rem", background: "#e3f2fd", borderRadius: "8px" }}>
                    <h3> How to Test</h3>
                    <ol>
                        <li><strong>Broken Button (No Handler)</strong>: Will be auto-detected after 3 seconds</li>
                        <li><strong>Broken Button (Does Nothing)</strong>: Click rapidly 3 times within 2 seconds</li>
                        <li>Open Console (F12) to see detection logs</li>
                        <li>Check your Bug Tracker Dashboard - new bugs should appear automatically!</li>
                    </ol>

                    <div style={{ marginTop: "1rem", padding: "1rem", background: "#fff", borderRadius: "4px" }}>
                        <strong>Expected Bug Reports:</strong>
                        <ul>
                            <li>Button without handler detected</li>
                            <li>User clicked button multiple times rapidly (frustrated user pattern)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
