import {createBrowserRouter} from "react-router-dom";
import ErrorPage from "../screens/ErrorScreens/ErrorPage.jsx";
import Home from "../screens/OfflineScreens/Home.jsx";
import Product from "../screens/OfflineScreens/Product.jsx";
import ProductId from "../screens/OfflineScreens/ProductId.jsx";
import Checkout from "../screens/OfflineScreens/Checkout.jsx";
import Success from "../screens/OfflineScreens/Succes.jsx";
import ManageBooking from "../screens/OfflineScreens/ManageBooking.jsx";
import Login from "../screens/OfflineScreens/Login.jsx";
import MainLayout from "../components/Layout/MainLayout.jsx";
import Owner from "../screens/OfflineScreens/Owner.jsx";
import CreatePassword from "../screens/OfflineScreens/CreatePassword.jsx";

const OfflineRouter = createBrowserRouter([
    {
        element: <MainLayout />,
        errorElement: <ErrorPage/>, // Élément retourné en cas d'erreur
        children: [
            {
                path: "/", // Chemin de la vue
                element: <Home/>, // Élément retourné
            },
            {
                path: "/product",
                element: <Product/>
            },
            {
                path: "/product/:id",
                element: <ProductId/>
            },
            {
                path: "/checkout",
                element: <Checkout/>
            },
            {
                path: "/success",
                element: <Success/>
            },
            {
                path: "/manage-booking/:id",
                element: <ManageBooking/>
            },
            {
                path: "/login",
                element: <Login/>
            },
            {
                path: "/owner",
                element: <Owner/>
            },
            {
                path: "/password",
                element: <CreatePassword />
            }
        ],
    },
]);

export default OfflineRouter;