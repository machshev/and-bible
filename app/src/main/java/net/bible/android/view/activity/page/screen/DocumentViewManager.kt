/*
 * Copyright (c) 2020 Martin Denham, Tuomas Airaksinen and the And Bible contributors.
 *
 * This file is part of And Bible (http://github.com/AndBible/and-bible).
 *
 * And Bible is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * And Bible is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with And Bible.
 * If not, see http://www.gnu.org/licenses/.
 *
 */
package net.bible.android.view.activity.page.screen

import android.view.View
import android.widget.LinearLayout
import net.bible.android.activity.R
import net.bible.android.control.event.ABEventBus
import net.bible.android.control.event.window.NumberOfWindowsChangedEvent
import net.bible.android.control.page.window.Window
import net.bible.android.control.page.window.WindowControl
import net.bible.android.view.activity.MainBibleActivityScope
import net.bible.android.view.activity.base.DocumentView
import net.bible.android.view.activity.mynote.MyNoteViewBuilder
import net.bible.android.view.activity.page.MainBibleActivity
import javax.inject.Inject

/**
 * Create Views for displaying documents
 *
 * @author Martin Denham [mjdenham at gmail dot com]
 */
@MainBibleActivityScope
class DocumentViewManager @Inject constructor(
	private val mainBibleActivity: MainBibleActivity,
	private val documentWebViewBuilder: DocumentWebViewBuilder,
	private val myNoteViewBuilder: MyNoteViewBuilder,
	private val windowControl: WindowControl
) {
    private val parent: LinearLayout = mainBibleActivity.findViewById(R.id.mainBibleView)
	fun destroy() {
        ABEventBus.getDefault().unregister(this)
    }

    fun onEvent(event: NumberOfWindowsChangedEvent) {
        buildView()
    }

    @Synchronized
    fun resetView() {
        myNoteViewBuilder.removeMyNoteView(parent)
        documentWebViewBuilder.removeWebView(parent)
        if (myNoteViewBuilder.isMyNoteViewType) {
            mainBibleActivity.resetSystemUi()
            myNoteViewBuilder.addMyNoteView(parent)
        } else {
            documentWebViewBuilder.addWebViews(parent)
        }
        val windows = windowControl.windowRepository.visibleWindows
        for (window in windows) {
            mainBibleActivity.registerForContextMenu(getDocumentView(window) as View)
        }
    }

    @Synchronized
    fun buildView() {
        if (myNoteViewBuilder.isMyNoteViewType) {
            mainBibleActivity.resetSystemUi()
            documentWebViewBuilder.removeWebView(parent)
            myNoteViewBuilder.addMyNoteView(parent)
        } else {
            myNoteViewBuilder.removeMyNoteView(parent)
            documentWebViewBuilder.addWebViews(parent)
        }
        val windows = windowControl.windowRepository.visibleWindows
        for (window in windows) {
            mainBibleActivity.registerForContextMenu(getDocumentView(window) as View)
        }
    }

    val documentView: DocumentView
        get() = getDocumentView(windowControl.activeWindow)

    fun getDocumentView(window: Window?): DocumentView {
        return if (myNoteViewBuilder.isMyNoteViewType) {
            myNoteViewBuilder.view
        } else { // a specific screen is specified to prevent content going to wrong screen if active screen is changed fast
            documentWebViewBuilder.getView(window!!)
        }
    }

    init {
		ABEventBus.getDefault().register(this)
    }
}