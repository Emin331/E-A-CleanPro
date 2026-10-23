
import Navbar from "./assets/Components/Navbar";
import Hero from "./assets/Components/Hero";
import Booking from "./assets/Components/Booking";
import Price from "./assets/Components/Price"
import Contact from "./assets/Components/Contact";


function App() {
    return (
        <>
            <Navbar />
            

            <Hero />

             <Booking />
             
             <Price/>

            <Contact />


            <footer>
                <div className="container footer">

                    <div className="logo">
                        E&A Clean<span>Pro</span>
                    </div>

                    <p>
                        © 2026 E&A CleanPro. All rights reserved.
                    </p>

                </div>
            </footer>
        </>
    );
}

export default App;

