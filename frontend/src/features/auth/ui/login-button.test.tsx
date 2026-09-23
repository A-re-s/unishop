import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginButton } from "./login-button";

describe("LoginButton", () => {
	it("links to the backend login endpoint", () => {
		render(<LoginButton />);

		const link = screen.getByRole("link", { name: /log in/i });
		expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/v1/auth/login"),
		);
	});
});
