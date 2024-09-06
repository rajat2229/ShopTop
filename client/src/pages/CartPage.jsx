import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateOfBuying, setDateOfBuying] = useState(""); // State to hold date of buying
  const [dateOfReturn, setDateOfReturn] = useState(""); // State to hold date of return
  const [totalCost, setTotalCost] = useState(0); // State to hold total cost
  const navigate = useNavigate();

  //total price
  const totalPrice = () => {
    try {
      let total = 0;
      cart?.map((item) => {
        total = total + item.price;
      });
      return total;
    } catch (error) {
      console.log(error);
    }
  };
  //detele item
  const removeCartItem = (pid) => {
    try {
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item._id === pid);
      myCart.splice(index, 1);
      setCart(myCart);
      localStorage.setItem("cart", JSON.stringify(myCart));
    } catch (error) {
      console.log(error);
    }
  };

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getToken();
  }, [auth?.token]);

  //handle payments
  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();

      const daysDifference = Math.ceil(
        (new Date(dateOfReturn) - new Date(dateOfBuying)) /
          (1000 * 60 * 60 * 24)
      );
      const totalCost = totalPrice() * daysDifference;

      const { data } = await axios.post("/api/v1/product/braintree/payment", {
        nonce,
        cart,
        totalCost,
        dateOfBuying,
        dateOfReturn
      });
      setLoading(false);
      localStorage.removeItem("cart");
      setCart([]);
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed Successfully ");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set date of buying to current date by default
    const currentDate = new Date().toISOString().split("T")[0];
    setDateOfBuying(currentDate);
  }, []);

  // Update total cost when date of return changes
  useEffect(() => {
    if (dateOfBuying && dateOfReturn) {
      const daysDifference = Math.ceil(
        (new Date(dateOfReturn) - new Date(dateOfBuying)) /
          (1000 * 60 * 60 * 24)
      );
      const totalCost = totalPrice() * daysDifference;
      setTotalCost(totalCost);
    }
  }, [dateOfBuying, dateOfReturn]);




  return (
    <Layout>
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {`Hello ${auth?.token && auth?.user?.name}`}
            </h1>
            <h4 className="text-center">
              {cart?.length
                ? `You Have ${cart.length} items in your cart ${
                    auth?.token ? "" : "please login to checkout"
                  }`
                : " Your Cart Is Empty"}
            </h4>
          </div>
        </div>
        <div className="row">
          <div className="col-md-8">
            {cart?.map((p) => (
              <div className="row mb-2 p-3 card flex-row" key={p._id}>
                <div className="col-md-4">
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                    width="100px"
                  />
                </div>
                <div className="col-md-8">
                  <p>{p.name}</p>
                  <p>{p.description.substring(0, 30)}</p>
                  <p>Price : {p.price}</p>
                  <button
                    className="btn btn-danger"
                    onClick={() => removeCartItem(p._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="col-md-4 text-center">
            <form>
              <h1 className="text-secondary">Buy From :</h1>
              <input
                type="date"
                className="form-control date-input"
                value={dateOfBuying}
                onChange={(e) => setDateOfBuying(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ced4da",
                  borderRadius: "0.25rem",
                  color: "#495057",
                  backgroundColor: "#fff",
                  borderColor: "#80bdff",
                }}
              />{" "}
              <br />
              <h1 className="text-secondary">To :</h1>
              <input
                type="date"
                className="form-control date-input"
                value={dateOfReturn}
                onChange={(e) => setDateOfReturn(e.target.value)}
              />
              <br />
            </form>
            {/* <h2>Cart Summary</h2>
            <p>Total | Checkout | Payment</p> */}
            <hr />
            <h4>Total :</h4>
            <h4 className="text-success"> {totalCost} /-</h4>
            {auth?.user?.address ? (
              <>
                <div className="mb-3">
                  <h4>Current Address : </h4>
                  <h5>{auth?.user?.address}</h5>
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => navigate("/dashboard/user/profile")}
                  >
                    Update Address
                  </button>
                </div>
              </>
            ) : (
              <div className="mb-3">
                {auth?.token ? (
                  <button
                    className="btn btn-outline-warning"
                    onClick={() => navigate("/dashboard/user/profile")}
                  >
                    Update Address
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-warning"
                    onClick={() =>
                      navigate("/login", {
                        state: "/cart",
                      })
                    }
                  >
                    Plase Login to checkout
                  </button>
                )}
              </div>
            )}
            <div className="mt-2">
              {!clientToken || !cart?.length ? (
                ""
              ) : (
                <>
                  <DropIn
                    options={{
                      authorization: clientToken,
                      paypal: {
                        flow: "vault",
                      },
                    }}
                    onInstance={(instance) => setInstance(instance)}
                  />

                  <button
                    className="btn btn-primary"
                    onClick={handlePayment}
                    disabled={loading || !instance || !auth?.user?.address}
                  >
                    {loading ? "Processing ...." : "Make Payment"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
