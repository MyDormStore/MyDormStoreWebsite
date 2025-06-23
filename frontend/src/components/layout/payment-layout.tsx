import { useFormStore } from "@/core/form";
import { useState } from "react";
import DeliveryForm from "../payments/delivery";
import PaymentForm from "../payments/payment";
import ShippingForm from "../payments/shipping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// The payment component is used to change the tabs shown for payment

const tabArray = ["Delivery", "Shipping", "Payment"];
type TabNames = (typeof tabArray)[number];

export default function PaymentLayout({ dorm }: { dorm: string }) {
    const [currentTab, setCurrentTab] = useState<TabNames>("Delivery");
    const [index, setIndex] = useState(0);

    const nextTab = () => {
        setIndex(index + 1);
        setCurrentTab(tabArray[index + 1]);
    };

    const prevTab = () => {
        setIndex(index - 1);
        setCurrentTab(tabArray[index - 1]);
    };

    /*

        For each tab of the form, it would be disabled until the previous section is done. Once the form is completed, then it will allow customer to check out

    */

    const shipping = useFormStore((state) => state.shipping);
    const payment = useFormStore((state) => state.payment);

    return (
        <div className="grid gap-2 shadow-2xl p-4 rounded-xl">
            <Tabs
                value={currentTab}
                // onValueChange={handleCurrentTab}
                className="w-full"
            >
                <TabsList className="w-full">
                    <TabsTrigger value={"Delivery"}>1. Delivery</TabsTrigger>
                    <TabsTrigger
                        value={"Shipping"}
                        disabled={!shipping.service}
                    >
                        2. Shipping
                    </TabsTrigger>
                    <TabsTrigger
                        value={"Payment"}
                        disabled={!payment.toggleSecondaryDetails}
                    >
                        3. Payment
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="Delivery">
                    <DeliveryForm nextTab={nextTab} dorm={dorm} />
                </TabsContent>
                <TabsContent value="Shipping">
                    <ShippingForm
                        prevTab={prevTab}
                        nextTab={nextTab}
                        dorm={dorm}
                    />
                </TabsContent>
                <TabsContent value="Payment">
                    <PaymentForm prevTab={prevTab} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/*

<div className={"flex gap-2"}>
                {currentTab !== "Delivery" && (
                    <Button className="flex-auto" onClick={prevTab}>
                        {" "}
                        Previous{" "}
                    </Button>
                )}
                {currentTab !== "Payment" && (
                    <Button className="flex-auto" onClick={nextTab}>
                        {" "}
                        Next{" "}
                    </Button>
                )}
                {currentTab === "Payment" && (
                    <Button className="flex-auto"> Pay now </Button>
                )}
            </div>

*/
