function openStock(event, stockName) {
    // Declare all variables
    var tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = $(".tabcontent").hide();

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = $(".tablinks").removeClass("active");
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    $("#" + stockName).show();
    $(event.currentTarget).addClass("active");

    if(stockName == "instock"){
        $("#id_stock-is_instock").val("True");
    }
    else {
        $("#id_stock-is_instock").val("False");
    }
} 

$("#default-open").trigger("click");