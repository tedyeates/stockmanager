$("#update-bar").on("click", ".add-cut", function(){
    // On cut add another size bar after last element
    var previous_element = $(this).prev();
    var previous_element_name = previous_element.attr("name");
    previous_element.after("<input class='form-control' type='text' name='" + previous_element_name + "x' value>");
});