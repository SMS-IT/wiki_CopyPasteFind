<?php

class CopyPasteFindHooks
{

    // hook - ...
    public static function onSkinTemplateNavigation($skin, array &$content_actions)
    {
        global $wgRequest, $wgUser;
        return true;
    }


    // hook -
    // Создаем константу  здесь, чтобы можно было увидеть ее в скрипте JS
    public static function onOutputPageBeforeHTML(&$out, &$text)
    {
        global $wgTitle, $wgUser;

        if ($wgTitle == null) return true;
        if (isset($_GET['printable']) && $_GET["printable"] == "yes") return true;

        $text .= "<script>
        const HTML_SAVED = $('.mw-parser-output').html();
		</script>";

        return true;
    }

    /**
     * @param $out OutputPage
     * @return bool
     */
    public static function addHTMLHeader(&$out)
    {
        // Добавляем скрипт JS в HTML страницы
        $out->addModules('ext.copypastefind');
        return true;
    }
}

?>

