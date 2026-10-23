
function Navbar() {
    return (
        <nav className="navbar">
            <div className="container navbar-inner">

                <div className="logo">
                    <div>E&A CleanPro</div>
                   
                </div>

                <div className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#booking">Book</a>
                    <a href="#pricing">Price</a>
                    
                    <a href="#contact">Contact</a>
                    
                </div>

                <a href="#booking" className="nav-button">
                    Book Now
                </a>

            </div>
        </nav>
    );
}

export default Navbar;
