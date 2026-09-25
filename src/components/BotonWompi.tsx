"use client";
import { useEffect } from "react";

export default function BotonWompi({ factura, firmaIntegridad, llavePublica }: any) {
  useEffect(() => {
    const container = document.getElementById("wompi-button-container");
    if (container && container.innerHTML === "") {
      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.setAttribute("data-render", "button");
      script.setAttribute("data-public-key", llavePublica);
      script.setAttribute("data-currency", factura.currency);
      script.setAttribute("data-amount-in-cents", factura.amountInCents.toString());
      script.setAttribute("data-reference", factura.reference);
      script.setAttribute("data-signature:integrity", firmaIntegridad);
      container.appendChild(script);
    }
  }, [factura, firmaIntegridad, llavePublica]);

  return <div id="wompi-button-container" className="flex justify-center min-h-12.5"></div>;
}