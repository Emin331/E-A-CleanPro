
function Pricing() {
    return (
        <section
            id="pricing"
            style={{
                padding: "100px 20px",
                background: "#f8faf9"
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "0 auto"
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "50px"
                    }}
                >
                    <p
                        style={{
                            color: "red",
                            fontWeight: "700",
                            letterSpacing: "1px",
                            marginBottom: "10px"
                        }}
                    >
                        OUR PRICES
                    </p>

                    <h2
                        style={{
                            fontSize: "40px",
                            color: "#17221c",
                            marginBottom: "15px"
                        }}
                    >
                        Simple & Transparent Pricing
                    </h2>

                    <p
                        style={{
                            color: "#666666"
                        }}
                    >
                        Our starting prices for house cleaning.
                    </p>
                </div>

                <div
                    style={{
                        maxWidth: "600px",
                        margin: "0 auto",
                        background: "#ffffff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "18px",
                        padding: "35px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "20px 0",
                            borderBottom: "1px solid #eeeeee"
                        }}
                    >
                        <span style={{ fontSize: "17px" }}>
                            🛏️ 1 Room
                        </span>

                        <strong style={{ color: "red" }}>
                            80 zł
                        </strong>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "20px 0",
                            borderBottom: "1px solid #eeeeee"
                        }}
                    >
                        <span style={{ fontSize: "17px" }}>
                            🍳 1 Kitchen
                        </span>

                        <strong style={{ color: "red" }}>
                            60 zł
                        </strong>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "20px 0"
                        }}
                    >
                        <span style={{ fontSize: "17px" }}>
                            🚿 1 Bathroom
                        </span>

                        <strong style={{ color: "red" }}>
                            60 zł
                        </strong>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Pricing;



