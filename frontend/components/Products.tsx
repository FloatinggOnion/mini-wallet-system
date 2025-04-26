"use client";

import axios from "axios";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    name: string;
    price: number;
}

interface ProductsPageProps {
    token: string;
}

const ProductsPage = ({ token }: ProductsPageProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [status, setStatus] = useState<number>(0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get<Product[]>(
                    "http://localhost:5237/api/products",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setProducts(response.data);
                setStatus(response.status);
            } catch (error: any) {
                if (error.response) {
                    setStatus(error.response.status);
                } else {
                    console.error("Error fetching products:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [token]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (status === 401) {
        return <p>You aren't logged in!</p>;
    }

    return (
        <div>
            <h1>Products List</h1>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        {product.name} - ${product.price}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductsPage;