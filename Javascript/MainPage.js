$('.navTrigger').click(function () {
    $(this).toggleClass('active');
    console.log("Clicked menu");
    $("#navTrigger").toggleClass("show_list");
    $("#navTrigger").fadeIn();
});
$