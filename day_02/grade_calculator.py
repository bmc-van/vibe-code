def main():
    name = input("Enter student name: ")
    
    try:
        mark1 = float(input("Enter marks for subject 1: "))
        if not (0 <= mark1 <= 100):
            print("Error: Marks must be between 0 and 100.")
            return

        mark2 = float(input("Enter marks for subject 2: "))
        if not (0 <= mark2 <= 100):
            print("Error: Marks must be between 0 and 100.")
            return

        mark3 = float(input("Enter marks for subject 3: "))
        if not (0 <= mark3 <= 100):
            print("Error: Marks must be between 0 and 100.")
            return
        
        average = (mark1 + mark2 + mark3) / 3
        
        print(f"\nStudent: {name}")
        print(f"Average Marks: {average:.2f}")
        
        if average >= 40:
            print("Status: Pass")
        else:
            print("Status: Fail")
            
    except ValueError:
        print("Invalid input. Please enter numerical values for marks.")

if __name__ == "__main__":
    main()
