import NavBar from "./components/layout/navbar";

export function SuccessPage() {
    return (
        <div className="w-dvw h-dvh overflow-y-scroll">
            <NavBar />
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
                <p className="text-lg mb-2">Thank you for your purchase.</p>
                <p className="text-md text-gray-600">
                    Your order has been processed successfully.
                </p>
                <p className="text-md text-gray-600">
                    You will receive a confirmation email shortly.
                </p>
                <p className="text-md text-gray-600">
                    If you have any questions, please contact our support team.
                </p>
                <p className="text-md text-gray-600">
                    Thank you for choosing our service!
                </p>
            </div>
        </div>
    );
}
