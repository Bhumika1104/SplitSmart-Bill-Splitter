package com.bill_splitter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BillSplitterApplication {

	public static void main(String[] args) {
		SpringApplication.run(BillSplitterApplication.class, args);
		System.out.println("Backend Start Successfully!");
	}

}
