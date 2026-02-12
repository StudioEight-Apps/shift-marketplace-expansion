import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border-subtle">
        <div className="container px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: February 2025
        </p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to Shift Rentals. Please carefully read and understand the following terms and
            conditions before using our services. By accessing or using our website and services, you
            agree to be bound by these terms and conditions. If you do not agree with any part of
            these terms, please refrain from using our services.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Definitions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>"Shift Rentals" refers to our company, its website, and its services.</li>
              <li>"User" or "You" refers to any individual accessing our website or using our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Rental Agreement</h2>
            <p className="mb-2">
              2.1. Shift Rentals offers high-end luxury vehicles for rental purposes. By booking a
              rental with us, you agree to the terms outlined in our Rental Agreement, which will be
              provided to you upon making a reservation.
            </p>
            <p>
              2.2. Renters must be at least 25 years old and possess a valid driver's license and
              insurance coverage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Booking and Payment</h2>
            <p className="mb-2">
              3.1. All bookings are subject to availability. We reserve the right to refuse or cancel
              bookings at our discretion.
            </p>
            <p>
              3.2. Payment for rentals is required in advance. We accept major credit cards and
              electronic payment methods.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Cancellation and Refund Policy</h2>
            <p className="mb-2">
              4.1. Cancellations made at least 48 hours before the scheduled rental period will receive
              a full refund. Cancellations made within 48 hours of the scheduled rental period are
              non-refundable.
            </p>
            <p>
              4.2. Refunds for cancellations will be processed within 14 business days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Vehicle Pickup and Return</h2>
            <p className="mb-2">
              5.1. Renters are responsible for picking up and returning the rented vehicle at the
              agreed-upon location and time.
            </p>
            <p>
              5.2. Late returns may be subject to additional charges. Please refer to the Rental
              Agreement for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Vehicle Usage</h2>
            <p className="mb-2">
              6.1. The rented vehicle should only be used for lawful purposes. Any illegal activities
              are strictly prohibited.
            </p>
            <p>
              6.2. Smoking and pets are not allowed in our rental vehicles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Damage and Insurance</h2>
            <p>
              7.1. Renters are responsible for any damage to the vehicle during the rental period.
              Insurance options are available and will be discussed during the booking process.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Privacy Policy</h2>
            <p>
              8.1. We take your privacy seriously. Please refer to our Privacy Policy to understand how
              we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Disclaimer</h2>
            <p>
              9.1. Shift Rentals is not responsible for any accidents, injuries, or losses that may
              occur during the rental period.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Amendments</h2>
            <p>
              10.1. Shift Rentals reserves the right to amend these terms and conditions at any time.
              Users will be notified of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding these terms and conditions, please
              contact us at{" "}
              <a
                href="mailto:shiftrentalssf@gmail.com"
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                shiftrentalssf@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
