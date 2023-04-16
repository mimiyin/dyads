I have a predefined list of notes [1, 2, 3, 4, 5, 6, 7], and the current index of the selected note is 0 (i.e. value 1). When I press left or right arrow key, it moves the current index to the left or the right, and if it is already at the beginning of the notes array or the end, it'll just loop.

Now I have a sequence of notes, called notes_sequence, denoted in this format: ["+1", "+3", "-4", "+5", ...]. For each element in the sequence, it is pulled from predefined list of notes, plus the direction, i.e. "+" or "-". "+" means it's moving to the right, and "-" means moving to the left. So "+3" means press right arrow X times until you hit note 3, and "-4" means press left arrow X times until you hit note 4.

Please write js code to:
1. declare the predefined notes list, and come up with a random notes_sequence of 10 elements.
3. the notes_sequence assumes that you're starting at note 1.
2. write a function that calculates for each element in the notes_sequence, how many times of left or right arrows should I press in order to get to this element.


This is NOT correct. Review the arrowPressesToElement logic and rewrite it. It should:
1. Look at each two elements in the notes_sequence, e.g. the 1st and the 2nd, the 2nd and 3rd, so on so forth, and calculate the number of arrow presses to get from one to the other.
2. Remember that the original notes array loops.

Just give me the code for the updated arrowPressesToElement function.

This is still incorrect. Let me clarify it for you. So the number of arrow presses should be denoted in this format [-1, 4, -5, ...], which means press left arrow 1 time, then right arrow 4 times, then left arrow 5 times. You current code doesn't take into the effect that the original notes list is looped. Please modify accordingly. Breakdown the logic step by step. This time give me the updated arrowPressesToElement and the loop that calls this function.
